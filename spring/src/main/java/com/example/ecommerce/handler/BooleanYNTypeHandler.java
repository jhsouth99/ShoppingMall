package com.example.ecommerce.handler;

import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

// @MappedJdbcTypes(JdbcType.CHAR) // DB 타입이 VARCHAR임을 명시
// @MappedTypes(Boolean.class) // Java 타입이 Boolean임을 명시 (어노테이션 또는 mybatis-config.xml에 등록)
public class BooleanYNTypeHandler extends BaseTypeHandler<Boolean> {

	private static final Logger logger = LoggerFactory.getLogger(BooleanYNTypeHandler.class);
    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, Boolean parameter, JdbcType jdbcType)
            throws SQLException {
        // Java의 boolean 값을 DB의 'Y'/'N' 문자열로 변환하여 설정
        ps.setString(i, parameter ? "Y" : "N");
    }

    @Override
    public Boolean getNullableResult(ResultSet rs, String columnName) throws SQLException {
        // DB에서 'Y'/'N' 문자열을 가져와 Java의 boolean 값으로 변환
        String s = rs.getString(columnName);
        return "Y".equalsIgnoreCase(s); // "Y" 또는 "y"인 경우 true, 그 외는 false
    }

    @Override
    public Boolean getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        // DB에서 'Y'/'N' 문자열을 가져와 Java의 boolean 값으로 변환
        String s = rs.getString(columnIndex);
        return "Y".equalsIgnoreCase(s);
    }

    @Override
    public Boolean getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        // DB에서 'Y'/'N' 문자열을 가져와 Java의 boolean 값으로 변환
        String s = cs.getString(columnIndex);
        return "Y".equalsIgnoreCase(s);
    }
}